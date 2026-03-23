import { useState, useEffect } from 'react';

const LogoFlipper = () => {
    const [logoIndex, setLogoIndex] = useState(0);
    const logos = [
        '/assets/acetel_logo.png',
        '/assets/noun_logo.png'
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setLogoIndex((prev) => (prev + 1) % logos.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-12 w-12 relative mr-3">
            {logos.map((src, index) => (
                <img
                    key={src}
                    src={src}
                    alt="Logo"
                    className={`absolute top-0 left-0 h-full w-full object-contain transition-opacity duration-1000 ${index === logoIndex ? 'opacity-100' : 'opacity-0'
                        }`}
                />
            ))}
        </div>
    );
};

export default LogoFlipper;
