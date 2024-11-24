import { useState, useRef, useEffect } from 'react';

const useClickOutside = (initialState = false) => {
    const [isVisible, setIsVisible] = useState(initialState);
    const ref = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                setIsVisible(false);
            }
        };

        if (isVisible) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isVisible]);

    return [isVisible, setIsVisible, ref];
};

export default useClickOutside;  