import React, { useState, useCallback, useRef } from 'react';

// Create a component that tracks and displays the number of times it has been rendered. 
// Use useRef to create a variable that persists across renders without causing additional renders 
//when it changes.

export function Assignment2() {

    console.log("omkar 1");
    const [, forceRender] = useState(0);

    const pRef=useRef();

    const handleReRender = () => {
        console.log("omkar 2");
        // Update state to force re-render
        let val=24;
        pRef.current.innerHTML=`This component has rendered ${val} times.`;
        // forceRender(Math.random());
    };

    return (
        <div>
            <p ref={pRef}>This component has rendered {0} times.</p>
            <button onClick={handleReRender}>Force Re-render</button>
        </div>
    );
};