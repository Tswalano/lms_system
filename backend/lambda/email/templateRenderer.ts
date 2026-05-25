import * as fs from 'fs';
import * as path from 'path';

const templateCache = new Map<string, string>();

function loadTemplate(name: string): string {
    const cached = templateCache.get(name);
    if (cached) return cached;

    const filePath = path.join(__dirname, 'templates', `${name}.html`);
    const content = fs.readFileSync(filePath, 'utf-8');
    templateCache.set(name, content);
    return content;
}

function renderTemplate(name: string, variables: Record<string, string>): string {
    const template = loadTemplate(name);

    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        if (!(key in variables)) {
            throw new Error(`Template '${name}' references placeholder '{{${key}}}' but no value was provided`);
        }
        return variables[key];
    });
}

export { loadTemplate, renderTemplate };
