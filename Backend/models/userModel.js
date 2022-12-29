const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please Enter Your Name"],
        maxLength: [30, "Name cannot exceed 30 characters"],
        minLength: [4, "Name should have more than 4 characters"]
    },
    email: {
        type: String,
        required: [true, "Please Enter Your Email"],
        unique: true,
        validate: [validator.isEmail, "Please Enter A Valid Email"]
        
    },
    password: {
        type: String,
        required: [true, "Please Enter Your Password"],
        minLength: [8, "Password should be greater than 8 characters"],
        select: false,
    },
    avatar: {
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    },
    role: {
        type: String,
        default: "user",
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,

});

// Make Hash Password
userSchema.pre("save", async function(next) { // before saving
    if (!this.isModified("password")) {
        next();
    }
    this.password = await bcrypt.hash(this.password, 10); //password hashing
})

//JWT Token
userSchema.methods.getJWTToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn:process.env.JWT_EXPIRE,
    })
}

//compare Password
userSchema.methods.comparePassword = async function (password) {
    
    return bcrypt.compare(password, this.password);
}

// Generating Password Reset Token
userSchema.methods.getResetPasswordToken = async function () {
    //Genetrating Token
    const resetToken = crypto.randomBytes(20).toString("hex");

    //hashing the resettoken and adding to UserSchema
    this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    //reset time for expiry
    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    return resetToken;

}

module.exports = mongoose.model("User", userSchema);
