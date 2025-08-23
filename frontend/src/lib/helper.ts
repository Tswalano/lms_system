

// export a function t create an avatar of GM if my name is Glen Mogane - just return GM for now
export function createAvatar(firstName: string, lastName?: string): string {
    if (!firstName || !lastName) {
        return 'SU'; // Default to System User if no names provided
    }
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
}

// function to camel case a string 
export function toCamelCase(str: string): string {
    return str
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) =>
            word.toUpperCase()
        )
        .replace(/\s+/g, '');
}

export function checkOverdue(date: string | Date, actualStatus: string): string {
    const targetDate = new Date(date);
    const now = new Date();

    if (isNaN(targetDate.getTime())) {
        throw new Error("Invalid date provided");
    }

    return targetDate < now ? "overdue" : actualStatus;
}


// Format date 2025-08-18T19:20:00.000Z
export function formatDate(date: string | Date | undefined): string {

    if (!date) {
        return '';
    }

    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const formattedDate = dateObj.toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    return formattedDate;
};