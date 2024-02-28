import { useRef } from "react";
import { useEffect } from "react";

// Create a component with a text input field and a button. When the component mounts or the button is clicked,
// automatically focus the text input field using useRef.

export function Assignment1() {

    const divRef = useRef();

    useEffect(() => {
        divRef.current.focus()
    }, [useRef]);



    const handleButtonClick = () => {
        divRef.current.focus()
    }

    return (
        <div>
            <input ref={divRef} type="text"></input>
            <button onClick={handleButtonClick}>Focus Input</button>
        </div>
    );
};
