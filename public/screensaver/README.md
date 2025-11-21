# 3D Flower Box Screensaver Customization

This document explains how to customize the 3D Flower Box screensaver using URL query parameters.

## How to Use

You can append the following parameters to the URL of `index.html` to change the screensaver's appearance and behavior.

### Example

To create a large, slow-spinning, complex flower box that doesn't change shape and has a single red color, you would use the following URL:

`.../public/screensaver/index.html?size=1.0&spinSpeed=20&complexity=50&bloom=false&coloring=one_color&color=ff0000`

## Parameters

| Parameter | Type | Default | Description | Example |
|---|---|---|---|---|
| `size` | float | `0.5` | Sets the overall size of the flower box. | `?size=0.8` |
| `spinSpeed`| integer | `88` | Sets the rotation speed of the flower box. | `?spinSpeed=50` |
| `complexity` | integer | `13` | Sets the geometric complexity of the shape. Higher values are more detailed. | `?complexity=30` |
| `bloom` | boolean | `true` | If `false`, the shape will not transform and will remain static. | `?bloom=false` |
| `coloring` | string | `per_side` | Sets the coloring mode. Can be `per_side` (default multi-color) or `one_color`. | `?coloring=one_color` |
| `color` | string (hex) | `ff0000` | The hex color to use when `coloring` is set to `one_color`. Do not include the `#`. | `?color=00ff00` |
| `cycle` | boolean | `false` | If `true`, the colors will gradually change over time. | `?cycle=true` |
