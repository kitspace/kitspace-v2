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
            is_opacity = key == "fill-opacity" or key == "stroke-opacity"
            if (not is_opacity) and key != "fill" and key != "stroke":
                new_style.append((key, value))

            # allow hiding fill or stroke through setting opacity to 0
            elif is_opacity and float(value) == 0:
                new_style.append((key, value))

        new_style_string = ""
        for key, value in new_style:
            new_style_string += f"{key}:{value}; "

        svgElement.set("style", new_style_string.strip())

