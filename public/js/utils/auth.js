export const handleAuthResponse = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const user = urlParams.get('user');
    const picture = urlParams.get('picture');
    if (token && user) {
        localStorage.setItem('malToken', token);
        localStorage.setItem('malUser', user);
        if (picture) {
            localStorage.setItem('malPicture', picture);
        }
        window.history.replaceState({}, document.title, '/');
    }
    return {
        loggedInUser: localStorage.getItem('malUser'),
        userPicture: localStorage.getItem('malPicture')
    };
};
