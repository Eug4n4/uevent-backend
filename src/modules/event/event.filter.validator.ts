import {
    isObject,
    registerDecorator,
    ValidationOptions
} from "class-validator";

export const IsRecord = (validationOptions?: ValidationOptions) => {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: "IsRecord",
            target: object.constructor,
            propertyName: propertyName,
            constraints: [],
            options: {
                message: "Wrong object format",
                ...validationOptions
            },
            validator: {
                validate(value: unknown) {
                    if (!isObject(value)) return false;
                    if (Object.keys(value).length === 0) return true;

                    const keys = Object.keys(value);

                    return keys.every((key) => {
                        if (typeof key !== "string") return false;
                        if (!Array.isArray(value[key])) return false;
                        if (!value[key].every((val) => typeof val === "string"))
                            return false;

                        return true;
                    });
                }
            }
        });
    };
};
