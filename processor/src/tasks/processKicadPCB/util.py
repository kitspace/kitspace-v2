import xml.etree.ElementTree as ET


def remove_color(svgElement):
    """
    Removes `stroke` and `fill` properties from inline styles on an SVG element
    parsed by ElementTree. Also removes `stroke-opacity` and `fill-opacity`
    when they are not set to 0.
    """
    style = svgElement.get("style")
    if style is not None:
        style = style.split(";")
        style = [rule.split(":") for rule in style if rule != ""]
        style = [(key.strip(), value.strip()) for (key, value) in style]

        new_style = []
        for key, value in style:
            if key not in ("fill", "stroke", "fill-opacity", "stroke-opacity"):
                new_style.append((key, value))

        new_style_string = ""
        for key, value in new_style:
            new_style_string += f"{key}:{value}; "

        svgElement.set("style", new_style_string.strip())


def empty_svg(**attrs: str) -> ET.ElementTree:
    document = ET.ElementTree(
        ET.fromstring(
            """<?xml version="1.0" standalone="no"?>
        <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
            "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
        <svg xmlns="http://www.w3.org/2000/svg" version="1.1"
            width="29.7002cm" height="21.0007cm" viewBox="0 0 116930 82680 ">
        </svg>"""
        )
    )
    root = document.getroot()
    for key, value in attrs.items():
        root.attrib[key] = value
    return document
