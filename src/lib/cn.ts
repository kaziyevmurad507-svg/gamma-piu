// Join class names, ignore false/undefined values
export const cn = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(' ');