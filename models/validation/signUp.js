
const Joi = require('joi')

module.exports = Joi.object().keys({
 uname: Joi.string().trim().required().lowercase().options({ convert: false}).error(new Error('Your username must be in lowercase !')), 
 fname: Joi.string().trim().required().error(new Error('Invalid fname ')), 
 lname: Joi.string().trim().required().error(new Error('Invalid lname')), 
 email: Joi.string().email().lowercase().error(new Error('Invalid email')),
 birthyear: Joi.number().integer().min(1930).max(2013).error(new Error('Invalid year of birth')),
 password: Joi.string().trim().required().regex(/^(?=.*[a-z])(?=.*[A-Z])/).error(new Error('Password is to weak. It must contain at least one uppercase and lowercase letter')),
role:Joi.string().required().trim().error(new Error('role not selected'))
});