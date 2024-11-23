export const convertDelimiters = (text) => {
    if (!text) return '';

    const blockRegex = /\\$$(.*?)\\$$/gs;
    const inlineRegex = /\\$(.*?)\\$/gs;

    return text
        .replace(/(?<!\n)\n(?!\n)/g, '  \n')
        .replace(blockRegex, (_, innerContent) => `$$${innerContent}$$`)
        .replace(inlineRegex, (_, innerContent) => `$${innerContent}$`);
};  