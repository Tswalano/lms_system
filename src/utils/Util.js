export function capitalizeName(name) {

    // if (!name.trim()) return '';

    if (name) {
        const parts = name.split(' ');

        const capitalizedParts = parts.map(part => part.charAt(0).toUpperCase() + part.slice(1));

        return capitalizedParts.join(' ');
    } else {
        return name;
    }
}

export function truncateEmail(email) {
    const parts = email.split('@');

    if (parts.length === 2) {
        return parts[0] + '@';
    } else {
        return email;
    }
}


export function formatDateTimeToSAST(dateTimeStr) {
    const date = new Date(dateTimeStr);

    const options = {
        year: 'numeric',
        month: 'long',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        // second: '2-digit',
        hour12: false,
        timeZone: 'Africa/Johannesburg'
    };

    return date.toLocaleDateString('en-US', options);
}
