/**
 * @typedef {Object} SchemaDataOptions
 * @property {String} name The name of the key **FROM** the object that is **INPUTTED**
 * @property {StringConstructor|BooleanConstructor|DateConstructor|ArrayConstructor|NumberConstructor} expected What type of item the Schema should be expecting {String, Boolean} etc
 * @property {*} [default=null] If its not the expected what it should default to
 * @property {Boolean} [extended=false] If it is extended, Extending is taking the key from the object and rerunning the function with the extender
 * @property {String} [extends=null] What Schema it should be extended from
 */

/**
 * @typedef {Object} Schema
 * @property {ObjectConstructor|ArrayConstructor} type The Type the Schema is
 * @property {{[key: string]: SchemaDataOptions}} data The Data that the schema should be expecting 
 */

/**
 * @type {Schema}
 */
module.exports = {}