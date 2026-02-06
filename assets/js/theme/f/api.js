export default function apiCall(url, method, payload) {
    return fetch(url, {
        method,
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    }).then(response => response);
}
