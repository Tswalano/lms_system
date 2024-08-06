export const sysColors = {
  primary: "rgb(93, 135, 255)",
  primarylight: "rgb(236,242,255)",
  error: "rgb(250,137,107)",
  errorlight: "rgb(253,237,232)",
  warning: "rgb(255,174,31)",
  warninglight: "rgb(254,245,229)",
  secondary: "rgb(73,190,255)",
  secondarylight: "rgb(232,247,255)",
  success: "rgb(76,175,80)",
  successlight: "rgb(237,247,237)"
};


export function capitalizeName(name) {
  // if (!name.trim()) return '';
  if (name) {
    const parts = name.split(" ");

    const capitalizedParts = parts.map(
      (part) => part.charAt(0).toUpperCase() + part.slice(1)
    );

    return capitalizedParts.join(" ");
  } else {
    return name;
  }
}

export function truncateEmail(email) {
  const parts = email.split("@");

  if (parts.length === 2) {
    return parts[0] + "@";
  } else {
    return email;
  }
}

export function formatDateTimeToSAST(dateTimeStr) {
  const date = new Date(dateTimeStr);

  const options = {
    year: "numeric",
    month: "long",
    day: "2-digit",
    // hour: '2-digit',
    // minute: '2-digit',
    // second: '2-digit',
    hour12: false,
    timeZone: "Africa/Johannesburg",
  };

  return date.toLocaleDateString("en-US", options);
}
