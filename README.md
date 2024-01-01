# Lightweight Slider
*Woohoo! Lightweight Slider!*

## About
As the name suggests, Lightweight Slider is a slider, that is (I think that it is) pretty lightweight. It doesn't contain many options, but is a prefect solution for someone who needs slider with simple setup fast. Slider's apperance and functionality can be changed or extended without worries.

## Features

- lightweight (13KB - 2KB of minified CSS and 11KB of not that much minified JS)
- CSS (or SCSS) and JS (or TS) code can be appended to other files preventing browsers from fetching additional files (which might have some impact on overall performance!)
- simple setup
- flexible and extensible
- should work on mobile
- mouse drag and touch swipe

## Installation
Installation is pretty simple. After TS and SCSS compilation, files need to be linked to application/website or files' code may be appended to other files and used the same way.

## Usage

For example usage check example folder (I recommend checking how creating slider works in index.html).

When calling `load_sliders(...)` function to initialize the slider funcionality, f.e.

```javascript
    load_sliders({
        'auto_slide_px': 20,
        'slider_speed': 100
    });
```

the available options are:
- `auto_slide_px` tells what's the border after which the slider should slide to the next or previous slider (in px)
- `slider_speed` tells what's the speed of the slider (play with it in order to match your requirements) 

## State
Slider probably won't receive many updates, only some patches are possible.