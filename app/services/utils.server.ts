export interface FormDataObject {
    [K: string]: any;
}

export function objectFromFormData<T extends FormDataObject>(
    formData: FormData,
    obj: T = Object.create({})
): T {
    let values = obj;

    for (let [key, value] of formData.entries()) {
        let typedKey: keyof T = key;

        if (values[typedKey]) {
            if (!(values[key] instanceof Array)) {
                // @ts-expect-error
                values[typedKey] = new Array(values[key]);
            }
            values[key].push(value);
        } else {
            // @ts-expect-error
            values[key] = value;
        }
    }
    return values;
}
