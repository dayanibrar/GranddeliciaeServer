import User from "../models/user";
import { hashPassword, comparePassword } from "../utils/auth";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import AWS from "aws-sdk";

const awsConfig = {
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  apiVersion: process.env.AWS_API_VERSION,
};

const SES = new AWS.SES(awsConfig);

export const register = async (req, res) => {
  try {
    // console.log(req.body);
    const { name, firstname, lastname, email, password } = req.body;
    // validation
    if (!name) return res.status(400).send("Name is required");
    if (!firstname) return res.status(400).send("First name is required");
    if (!lastname) return res.status(400).send("Last name is required");
    if (!password || password.length < 12 ) {
      return res
        .status(400)
        .send("Password is required and should be a min of 12 characters long");
    }
    let userExist = await User.findOne({ email }).exec();
    if (userExist) return res.status(400).send("Email address is already taken");

    // hash password
    const hashedPassword = await hashPassword(password);

    // register
    const user = new User({
      name,
      firstname,
      lastname,
      email,
      password: hashedPassword,
    });
    await user.save();
    // console.log("saved user", user);
    return res.json({ ok: true });
  } catch (err) {
    console.log(err);
    return res.status(400).send("Error. Try again.");
  }
};

export const login = async (req, res) => {
  try {
    // console.log(req.body);
    const { email, password } = req.body;
    // check if our db has user with that email
    const user = await User.findOne({ email }).exec();
    if (!user) return res.status(400).send("No user found");
    // check password
    const match = await comparePassword(password, user.password);
    if (!match) return res.status(400).send("Wrong password");

    // create signed jwt
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    // return user and token to client, exclude hashed password
    user.password = undefined;
    // send token in cookie
    res.cookie("token", token, {
      httpOnly: true,
      // secure: true, // only works on https
    });
    // send user as json response
    res.json(user);
  } catch (err) {
    console.log(err);
    return res.status(400).send("Error. Try again.");
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("token");
    return res.json({ message: "Signout success" });
  } catch (err) {
    console.log(err);
  }
};

export const currentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password").exec();
    console.log("CURRENT_USER", user);
    return res.json({ ok: true });
  } catch (err) {
    console.log(err);
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    // console.log(email);
    const shortCode = nanoid(8).toUpperCase();
    const user = await User.findOneAndUpdate(
      { email },
      { passwordResetCode: shortCode }
    );
    if (!user) return res.status(400).send("User not found");

    // prepare for email
    const params = {
      Source: process.env.EMAIL_FROM,
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: `
                <html>
                  <h1>Reset password</h1>
                  <p>User this code to reset your password</p>
                  <h2 style="color:red;">${shortCode}</h2>
                  <i>xidasstudios.com</i>
                </html>
              `,
          },
        },
        Subject: {
          Charset: "UTF-8",
          Data: "Reset Password",
        },
      },
    };

    const emailSent = SES.sendEmail(params).promise();
    emailSent
      .then((data) => {
        console.log(data);
        res.json({ ok: true });
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (err) {
    console.log(err);
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword, newName } = req.body;
    // console.table({ email, code, newPassword });
    const hashedPassword = await hashPassword(newPassword);
    const name = await (newName);

    const user = User.findOneAndUpdate(
      {
        email,
        passwordResetCode: code,
      },
      {
        password: hashedPassword,
        name: name,
        passwordResetCode: "",
      }
    ).exec();
    res.json({ ok: true });
  } catch (err) {
    console.log(err);
    return res.status(400).send("Error! Try again.");
  }
};


export const updateProfileAuth = async (req, res) => {
  try {
    const { email } = req.body;
    // console.log(email);
    const shortCode = nanoid(8).toUpperCase();
    const user = await User.findOneAndUpdate(
      { email },
      { profileUpdateCode: shortCode }
    );
    if (!user) return res.status(400).send("User not found");

    // prepare for email
    const params = {
      Source: process.env.EMAIL_FROM,
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: `
                <html>
                  <h1>Update your profile</h1>
                  <p>User this code to update your profile</p>
                  <h2 style="color:red;">${shortCode}</h2>
                  <i>xidasstudios.com</i>
                </html>
              `,
          },
        },
        Subject: {
          Charset: "UTF-8",
          Data: "Update Profile",
        },
      },
    };

    const emailSent = SES.sendEmail(params).promise();
    emailSent
      .then((data) => {
        console.log(data);
        res.json({ ok: true });
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (err) {
    console.log(err);
  }
};

export const updateprofile = async (req, res) => {
  try {
    const { email, code, newFirstName, newLastName, newName, newEmail } = req.body;
    // console.table({ email, code, newPassword });
    const firstname = await (newFirstName)
    const lastname = await (newLastName)
    const name = await (newName);
    const newemail = await (newEmail);

    const user = User.findOneAndUpdate(
      {
        email,
        profileUpdateCode: code,
      },
      {
        firstname: firstname,
        lastname: lastname,
        name: name,
        email: newemail,
        profileUpdateCode: "",
      }
    ).exec();
    res.json({ ok: true });
  } catch (err) {
    console.log(err);
    return res.status(400).send("Error! Try again.");
  }
};
