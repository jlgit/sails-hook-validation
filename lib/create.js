'use strict';
//import sails waterline Deferred
var Deferred = require('sails/node_modules/waterline/lib/waterline/query/deferred');

/**
 * @description path sails `create()` method to allow
 *              custom error message definitions
 * @param  {Object} model          a valid sails model
 * @param  {Function} validateCustom a function to transform sails `ValidationError`
 *                                   to custome `Errors`
 */
module.exports = function(model, validateCustom) {
    //remember sails defined create
    //method
    //See https://github.com/balderdashy/waterline/blob/master/lib/waterline/query/dql/create.js
    var sailsCreate = model.create;

    //prepare new create method
    //which wrap sailsCreate
    //with custom error message checking
    function create(values, callback) {

        // handle Deferred where 
        // it passes criteria first
        // see https://github.com/balderdashy/waterline/blob/master/lib/waterline/query/dql/create.js#L26
        if (arguments.length === 3) {
            var args = Array.prototype.slice.call(arguments);
            callback = args.pop();
            values = args.pop();
        }

        // return Deferred
        // if no callback passed
        // See https://github.com/balderdashy/waterline/blob/master/lib/waterline/query/dql/create.js#L54
        if (typeof callback !== 'function') {
            //this refer to the
            //model context
            return new Deferred(model, model.create, {}, values);
        }

        //otherwise
        //call sails create
        sailsCreate
            .call(model, values, function(error, result) {
                //any create error
                //found?
                if (error) {
                    //process sails ValidationError and
                    //attach Errors key in error object
                    //as a place to lookup for our 
                    //custom errors messages
                    if (error.ValidationError) {
                        error.Errors =
                            validateCustom(model, error.ValidationError);
                    }

                    callback(error);
                } else {
                    //no error
                    //return
                    callback(null, result);
                }
            });
    }

    //bind our new create
    //to our models
    model.create = create;
};