# Adapted from https://github.com/yaqwsx/PcbDraw/

import sys
from typing import Callable, Tuple, Union
import svgpathtools
from lxml import etree

Numeric = Union[int, float]
Box = Tuple[Numeric, Numeric, Numeric, Numeric]


def merge_bbox(left: Box, right: Box) -> Box:
    """
    Merge bounding boxes in format (xmin, xmax, ymin, ymax)
    """
    return tuple([f(l, r) for l, r, f in zip(left, right, [min, max, min, max])])  #


def ki2mm(val: int) -> float:
    return val / 1000000.0


def shrink_svg(svg: etree.ElementTree, margin: int) -> None:
    """
    Shrink the SVG canvas to the size of the drawing. Add margin in
    KiCAD units.
    """
    # We have to overcome the limitation of different base types between
    # PcbDraw and svgpathtools
    from xml.etree.ElementTree import fromstring as xmlParse

    from lxml.etree import tostring as serializeXml  # type: ignore

    paths = svgpathtools.document.flattened_paths(xmlParse(serializeXml(svg)))

    if len(paths) == 0:
        return
    bbox = paths[0].bbox()
    for x in paths:
        bbox = merge_bbox(bbox, x.bbox())
    bbox = list(bbox)
    bbox[0] -= int(margin)
    bbox[1] += int(margin)
    bbox[2] -= int(margin)
    bbox[3] += int(margin)

    root = svg.getroot()
    root.attrib["viewBox"] = "{} {} {} {}".format(
        bbox[0], bbox[2], bbox[1] - bbox[0], bbox[3] - bbox[2]
    )
    root.attrib["width"] = str(ki2mm(int(bbox[1] - bbox[0]))) + "mm"
    root.attrib["height"] = str(ki2mm(int(bbox[3] - bbox[2]))) + "mm"
