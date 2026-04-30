

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

export function dateToNextYear(date: string | Date | undefined): string {
    if (!date) {
        return '-';
    }
    const d = new Date(date);
    const next = new Date(d);
    next.setFullYear(d.getFullYear() + 1);
    return formatDate(next);
}

export function timeAgo(date: string | Date): string {
    const updatedDate = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - updatedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else {
        const months = Math.floor(diffDays / 30);
        return `${months} month${months > 1 ? 's' : ''} ago`;
    }
}

// Check if birthday falls on Saturday and return observed date message
export function getBirthdayDisplayDate(dob: string | Date | undefined): { date: string; note: string | undefined } {
    if (!dob) {
        return { date: '', note: undefined };
    }

    const dateObj = typeof dob === 'string' ? new Date(dob) : dob;
    const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 6 = Saturday

    if (dayOfWeek === 6) {
        // Saturday - show as Friday (observed)
        const friday = new Date(dateObj);
        friday.setDate(friday.getDate() - 1);
        return {
            date: formatDate(friday),
            note: 'Observed on Friday (weekend)'
        };
    }

    return { date: formatDate(dateObj), note: undefined };
}
