const express = require('express');
const { check, validationResult } = require('express-validator');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const router = express.Router();

router.post(
    '/signup',
    [
        check('phone')
            .isLength({ min: 10, max: 10 })
            .withMessage('Mobile number must be exactly 10 digits')
            .custom(async (value) => {
                const existingUser = await User.findOne({ phone: value });
                if (existingUser) {
                    throw new Error('Mobile number is already in use');
                }
            }),

        check('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters')
            .matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
            .withMessage('Password must contain at least one alphabet, one number, and one special character'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const salt = bcrypt.genSaltSync(10);
            let user = new User({
                phone: req.body.phone,
                password: bcrypt.hashSync(req.body.password, salt),
            });

            user = await user.save();

            if (!user) {
                return res.status(400).send('The user was not created.');
            }

            res.status(201).send('The user was created successfully!');
        } catch (err) {
            if (err.name === 'MongoError' && err.code === 11000) {
                return res.status(400).json({ error: 'Phone number must be unique.' });
            }
            console.log(err);
            return res.status(500).json({ error: 'An error occurred while processing your request.' });
        }
    }
);


router.get('/', async (req, res) => {
    try {
        const userList = await User.find({}, { phone: 1, _id: 0 });

        if (!userList) {
            return res.status(500).json({ success: false });
        }

        res.send(userList);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});

module.exports = router;