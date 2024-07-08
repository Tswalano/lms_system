export function capitalizeName(name) {
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

