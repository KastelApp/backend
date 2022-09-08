/**
 * @type {import('./SchemaTypes').Schema}
 */
const template = {
    type: String,
    data: {
        example: {
            name: '_example',
            expected: String,
            default: 'This is an Example',
        },
        extended_example: {
            name: '_extended',
            extended: true,
            extends: 'template2',
        },
    },
};

module.exports = template;