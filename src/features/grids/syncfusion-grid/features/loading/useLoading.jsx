import {useState, useCallback, useEffect} from 'react';
import CustomSpinner from '../../../custom-spinner/CustomSpinner.jsx';

export const LoadingOverlay = () => {
    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(var(--color-background-default), 0.92)',
            zIndex: 1000
        }}>
            <CustomSpinner/>
        </div>
    );
};

export const useLoading = (loading = false) => {
    const [isLoading, setIsLoading] = useState(loading);

    useEffect(() => {
        setIsLoading(loading);
    }, [loading]);

    const setLoading = useCallback((newLoading) => {
        setIsLoading(newLoading);
    }, []);

    const LoadingComponent = isLoading ? <LoadingOverlay/> : null;

    return {isLoading, setLoading, LoadingComponent};
};
