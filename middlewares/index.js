const validateBody = require("./validateBody");
const isValidId = require("./isValidId");
const validateFavorite = require("./validateFavorite");
const authenticate = require("./authentication");
const upload = require("./upload");

module.exports = {
    validateBody,
    isValidId,
    validateFavorite,
    authenticate,
    upload,
};