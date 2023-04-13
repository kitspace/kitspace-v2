# Adapted from https://github.com/yaqwsx/PcbDraw/

import sys
from typing import Callable, Tuple, Union
import svgpathtools
import xml.etree.ElementTree as ET

Numeric = Union[int, float]
Box = Tuple[Numeric, Numeric, Numeric, Numeric]


def merge_bbox(left: Box, right: Box) -> Box:
    """
    Merge bounding boxes in format (xmin, xmax, ymin, ymax)
    """
    return tuple([f(l, r) for l, r, f in zip(left, right, [min, max, min, max])])  #


def shrink_svg(svg: ET.ElementTree, margin_mm: float) -> None:
    """
    Shrink the SVG canvas to the size of the drawing. Add margin in millimeters.
    """
    root = svg.getroot()
    # not sure why we need to do `tostring` and then `fromstring` here but
    # otherwise we just get an empty list for `paths`. `copy.deepcopy(root)` didn't work.
    paths = svgpathtools.document.flattened_paths(ET.fromstring(ET.tostring(root)))

    if len(paths) == 0:
        return
    bbox = paths[0].bbox()
    for x in paths:
        bbox = merge_bbox(bbox, x.bbox())
    bbox = list(bbox)
    bbox[0] -= margin_mm
    bbox[1] += margin_mm
    bbox[2] -= margin_mm
    bbox[3] += margin_mm

    root.set(
        "viewBox",
        "{} {} {} {}".format(bbox[0], bbox[2], bbox[1] - bbox[0], bbox[3] - bbox[2]),
    )
    root.set("width", str(bbox[1] - bbox[0]) + "mm")
    root.set("height", str(bbox[3] - bbox[2]) + "mm")
