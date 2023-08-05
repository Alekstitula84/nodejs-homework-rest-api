const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const path = require("path");
const fs = require("fs/promises");
const Jimp = require("jimp");
const { uuid } = require("uuid");

const { User } = require("../models/users");

const { RequestError, ctrlWrapper, sendEmail } = require("../helpers");


const { SECRET_KEY, BASE_URL } = process.env;
const avatarsDir = path.join(__dirname, "../", "public", "avatars");

const register = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user) {
        throw RequestError(409, "Email in use");
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const avatarURL = gravatar.url(email);
    const verificationCode = uuid();

    const newUser = await User.create({
        ...req.body,
        password: hashPassword,
        avatarURL,
        verificationCode,
    });

    const verifyEmail = {
        to: email,
        subject: "Verify email",
        html: `<a target="_blank" href="${BASE_URL}/api/users/verify/${verificationCode}">Click here to verify your email</a>`,
    };
    await sendEmail(verifyEmail);
    res.json({
        email: newUser.email,
        name: newUser.name,
    });
};

const verifyEmail = async (req, res) => {
    const { verificationToken } = req.params;

    const user = await User.findOne({ verificationToken });

    if (!user) {
        throw RequestError(404, "User not found");
    }

    await User.findByIdAndUpdate(user._id, {
        verify: true,
        verificationToken: null,
    });

    res.json({ message: "Verification successful" });
};

const login = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        throw RequestError(410, "Email or password is wrong");
    }

    if (!user.verify) {
        throw RequestError(
            401,
            "Email was not verified. Please verify your email."
        );
    }

    const passCompare = await bcrypt.compare(password, user.password);
    if (!passCompare) {
        throw RequestError(410, "Email or password is wrong");
    }

    const payload = {
        id: user._id,
    };
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "47h" });
    await User.findByIdAndUpdate(user._id, { token });
    res.json({
        token,
    });
};


const resendVerifyEmail = async (req, res) => {
    const { BASE_URL } = process.env;
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        throw RequestError(
            401,
            "User with this email not found in our base. Please check your email."
        );
    }

    if (user.verify) {
        res.status(400).json({ message: "Verification has already been passed" });
    }

    const verifyEmail = {
        to: email,
        subject: "Verify your email",
        html: `<a target="_blank" href="${BASE_URL}/api/users/verify/${user.verificationToken}">Click here to verify your email</a>`,
    };

    await sendEmail(verifyEmail);

    res
        .status(201)
        .json({ message: "Email was send again. Please check your email" });
};
const getCurrent = async (req, res) => {
    const { email, name } = req.user;
    res.json({
        email,
        name,
    });
};

const logout = async (req, res) => {
    const { _id } = req.user;
    await User.findByIdAndUpdate(_id, { token: "" });
    res.status(204).json();
};

const updateAvatar = async (req, res) => {
    const { _id } = req.user;
    const { path: tepmUpload, originalname } = req.file;
    const filename = `${_id}_${originalname}`;
    const resultUpload = path.join(avatarsDir, filename);
    await fs.rename(tepmUpload, resultUpload);
    const avatarURL = path.join("avatars", filename);
    await User.findByIdAndUpdate(_id, { avatarURL });
    Jimp.read(`${avatarsDir}/${filename}`, (err, fileAvatar) => {
        if (err) throw err;
        fileAvatar.cover(250, 250).quality(60).write(`${avatarsDir}/${filename}`);
    });
    res.json({ avatarURL });
};
module.exports = {
    register: ctrlWrapper(register),
    login: ctrlWrapper(login),
    getCurrent: ctrlWrapper(getCurrent),
    logout: ctrlWrapper(logout),
    updateAvatar: ctrlWrapper(updateAvatar),
    verifyEmail: ctrlWrapper(verifyEmail),
    resendVerifyEmail: ctrlWrapper(resendVerifyEmail),
};