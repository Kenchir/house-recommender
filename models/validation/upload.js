 
const Joi = require('joi')

module.exports = Joi.object().keys({
 name: Joi.string().trim().required().error(new Error('Invalid House name')), 
 description: Joi.string().trim().required().error(new Error('Invalid description')), 
 location: Joi.string().trim().required().error(new Error('Location not set')), 
 image: Joi.string().email().lowercase().error(new Error('Images required')),
 // internet: Joi.string().trim().required().error(new Error('Location not set')), 
 // water: Joi.string().trim().required().error(new Error('Location not set')), 
 // room_types: Joi.string().trim().required().error(new Error('Location not set')), 
});