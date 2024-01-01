interface Settings {
    // Pixels after which slider should slide to other element
    auto_slide_px: number,
    slider_speed: number
}

interface Slider {
    slider_container_element: HTMLElement,
    slider_control_panel_element: HTMLElement,
    slider_control_panel_blocks?: NodeListOf<Element>, // can't be set during initialization
    slider_elements: NodeListOf<Element>,
    translate_x: number,
    start_mouse_x: number,
    current_mouse_x: number,
    pressing: boolean,
    during_animation: boolean,
    child_element_width: number,
    child_elements_count: number,
    current_element_index: number
}

interface Listener_Data {
    'function': (event: MouseEvent | TouchEvent, slider: Slider) => void,
    'event_names': string[]
}

const load_sliders = (settings: Settings) => {
    const slider_elements = document.querySelectorAll('.slider');
    if(slider_elements.length < 1) return;

    // How many elements are copied before and after the original slider's elements
    const ELEMENTS_COPY_COUNT = 3;

    const update_slider_view = (slider: Slider, mouse_x_difference: number) => {
        slider.translate_x -= mouse_x_difference;
        slider.slider_container_element.style.transform = `translateX(${slider.translate_x}px)`;
    };

    const set_slider_view = (slider: Slider, set_to_x: number) => {
        const direction: 'left' | 'right' = slider.translate_x < set_to_x ? 'left' : 'right';
        
        slider.during_animation = true;
        const animate = () => {
            if((direction === 'right' &&
                Math.abs(slider.translate_x) + Math.abs(settings.slider_speed) >= Math.abs(set_to_x)) ||
                (direction === 'left' &&
                Math.abs(slider.translate_x) - Math.abs(settings.slider_speed) <= Math.abs(set_to_x))) {
                if(direction === 'right') slider.translate_x -= Math.abs(set_to_x) - Math.abs(slider.translate_x);
                else slider.translate_x += Math.abs(slider.translate_x) - Math.abs(set_to_x);
            } else {
                if(direction === 'right') slider.translate_x -= settings.slider_speed;
                else slider.translate_x += settings.slider_speed;
            }
            
            slider.slider_container_element.style.transform = `translateX(${slider.translate_x}px)`;

            if((direction === 'right' && Math.abs(set_to_x) > Math.abs(slider.translate_x)) ||
                (direction === 'left' && Math.abs(set_to_x) < Math.abs(slider.translate_x))) {
                requestAnimationFrame(animate);
            } else
                slider.during_animation = false;
        };
        requestAnimationFrame(animate);
    };

    // Checks if slider can display next or previous slide and does it if yes
    const scroll_slider_child_to_nearest = (slider: Slider) => {
        const current_child_start_x = -slider.current_element_index * slider.child_element_width;
        const current_child_end_x = -(slider.current_element_index + 1) * slider.child_element_width;

        // Executes if slider isn't in "during animation" state
        const execute_when_available = (func: () => void) => {
            if(slider.during_animation) {
                requestAnimationFrame(() => execute_when_available(func));
                return;
            }
            func();
        };

        const loop_slider = () => {
            if(slider.current_element_index < ELEMENTS_COPY_COUNT)
                slider.current_element_index = slider.child_elements_count - 1 + ELEMENTS_COPY_COUNT;

            if(slider.current_element_index >= slider.child_elements_count + ELEMENTS_COPY_COUNT)
                slider.current_element_index = ELEMENTS_COPY_COUNT;

            slider.translate_x = -slider.child_element_width * slider.current_element_index;
            update_slider_view(slider, 0);
        };

        const manage_scrolling = () => {
            if(slider.translate_x - slider.child_element_width < current_child_end_x - settings.auto_slide_px) {
                slider.current_element_index++;
                set_slider_view(slider, current_child_end_x);
            } else if(slider.translate_x > current_child_start_x + settings.auto_slide_px) {
                slider.current_element_index--;
                set_slider_view(slider, current_child_start_x + slider.child_element_width);
            } else {
                slider.translate_x = current_child_start_x;
            }
        };

        execute_when_available(manage_scrolling);

        // Loops slider if possible
        if(slider.current_element_index < ELEMENTS_COPY_COUNT ||
            slider.current_element_index >= slider.child_elements_count + ELEMENTS_COPY_COUNT)
            execute_when_available(loop_slider);

        update_slider_view(slider, 0);
    };

    // Prepares slider (creates copies, etc.)
    const prepare_slider = (slider: Slider, copy_count: number) => {
        let slider_elements_length = slider.slider_elements.length;
        if(slider_elements_length < 1) return;

        const get_slider_element_index = (index: number) => {
            if(index >= 0 && index < slider_elements_length) return index;
            if(index >= 0 && index >= slider_elements_length) return index - Math.floor(index / slider_elements_length) * slider_elements_length;
            // Slider with one element is a special case - should always return 0
            if(slider_elements_length === 1) return 0;
            return (slider_elements_length - 1) -
                (Math.abs(index) - (Math.abs(index) > slider_elements_length ? (Math.floor(Math.abs(index) / slider_elements_length) * slider_elements_length) : 0) - 1);
        };

        const get_slider_element = (index: number) => {
            return slider.slider_elements[get_slider_element_index(index)].cloneNode(true);
        };

        for(let i = -1; i >= -copy_count; i--)
            slider.slider_container_element.insertBefore(get_slider_element(i), slider.slider_container_element.firstChild);

        for(let i = 0; i < copy_count; i++)
            slider.slider_container_element.appendChild(get_slider_element(i));

        slider.translate_x = -slider.child_element_width * copy_count;
        slider.current_element_index = ELEMENTS_COPY_COUNT;
        update_slider_view(slider, 0);
    };

    const adjust_slider_on_resize = (slider: Slider) => {
        const new_child_element_width = slider.slider_container_element.querySelector('.slider-element').clientWidth;
        if(new_child_element_width === slider.child_element_width) return;

        slider.translate_x = -slider.current_element_index * new_child_element_width;
        update_slider_view(slider, 0);
        slider.child_element_width = new_child_element_width;
    };

    const slider_down_hook = (event: MouseEvent | TouchEvent, slider: Slider) => {
        if(slider.pressing) return;
        slider.pressing = true;
        slider.current_mouse_x = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    };

    const slider_move_hook = (event: MouseEvent | TouchEvent, slider: Slider) => {
        if(!slider.pressing) return;

        let client_x = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
        const mouse_x_difference = slider.current_mouse_x - client_x;
        update_slider_view(slider, mouse_x_difference);

        slider.current_mouse_x = client_x;
    };

    const slider_up_hook = (event: MouseEvent | TouchEvent, slider: Slider) => {
        if(!slider.pressing) return;

        const prepare_change_block = () => {
            if(slider.during_animation) {
                requestAnimationFrame(prepare_change_block);
                return;
            }
            change_slider_control_panel_block(slider, slider.slider_control_panel_blocks[slider.current_element_index - ELEMENTS_COPY_COUNT] as HTMLElement);
        };

        scroll_slider_child_to_nearest(slider);
        slider.pressing = false;
        prepare_change_block();
    };

    const change_slider_control_panel_block = (slider: Slider, new_current_block: HTMLElement) => {
        const active_block = slider.slider_control_panel_element.querySelector('.block.current');
        active_block.classList.remove('current');
        new_current_block.classList.add('current');
    };

    const load_slider_control_panel = (slider: Slider) => {
        const create_control_panel_block = (link_to_original_index: number): HTMLElement => {
            const control_panel_block = document.createElement('div');
            control_panel_block.classList.add('block');
            control_panel_block.setAttribute('data-link-to-original-index', link_to_original_index.toString());

            return control_panel_block;
        };

        const block_click_hook = (e: MouseEvent) => {
            if(slider.during_animation) return;

            const block_click_target = e.target as HTMLElement;
            const link_index = parseInt(block_click_target.getAttribute('data-link-to-original-index'));
            slider.current_element_index = link_index + ELEMENTS_COPY_COUNT;

            change_slider_control_panel_block(slider, block_click_target);

            set_slider_view(slider, -(link_index + ELEMENTS_COPY_COUNT) * slider.child_element_width);
        };

        for(let i = 0; i < slider.child_elements_count; i++) {
            const control_panel_block = create_control_panel_block(i);
            if(i === 0) control_panel_block.classList.add('current');

            slider.slider_control_panel_element.appendChild(control_panel_block);
            control_panel_block.addEventListener('click', block_click_hook);
        }

        slider.slider_control_panel_blocks = slider.slider_control_panel_element.querySelectorAll('.block');
    };

    slider_elements.forEach(slider_element => {
        const slider_container = slider_element.querySelector('.slider-container');

        const slider: Slider = {
            'slider_container_element': slider_container as HTMLElement,
            'slider_control_panel_element': slider_element.querySelector('.slider-control-panel'),
            'slider_elements': slider_container.querySelectorAll('.slider-element'),
            'translate_x': 0,
            'start_mouse_x': 0,
            'current_mouse_x': 0,
            'pressing': false,
            'during_animation': false,
            'child_element_width': slider_container.querySelector('.slider-element').clientWidth,
            'child_elements_count': slider_container.childElementCount,
            'current_element_index': 0
        };

        prepare_slider(slider, ELEMENTS_COPY_COUNT);

        window.addEventListener('resize', e => adjust_slider_on_resize(slider));

        const listeners: Listener_Data[] = [
            {
                'function': slider_down_hook,
                'event_names': ['mousedown', 'touchstart']
            },
            {
                'function': slider_move_hook,
                'event_names': ['mousemove', 'touchmove']
            },
            {
                'function': slider_up_hook,
                'event_names': ['mouseup', 'mouseleave', 'touchend', 'touchcancel']
            }
        ];

        listeners.forEach(listener_data => {
            listener_data.event_names.forEach(event_name => {
                slider_container.addEventListener(event_name, (e: MouseEvent | TouchEvent) => listener_data.function(e, slider));
            });
        });

        load_slider_control_panel(slider);

        slider_element.classList.remove('slider-hidden');
    });
};