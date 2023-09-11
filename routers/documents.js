const express = require('express');
const Document = require('../models/document');
const User = require('../models/user');
const router = express.Router();
const bcrypt = require('bcryptjs');

const authenticate = async (req, res, next) => {
    try {
        const authorizationHeader = req.headers.authorization;

        if (!authorizationHeader) {
            return res.status(401).json({ error: 'Authentication failed.' });
        }

        const credentialsBase64 = authorizationHeader.split(' ')[1];
        const credentials = Buffer.from(credentialsBase64, 'base64').toString('utf-8');
        const [phone, password] = credentials.split(':');

        const user = await User.findOne({ phone });

        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ error: 'Authentication failed.' });
        }

        req.authenticatedUser = user;
        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
};

router.post('/', authenticate, async (req, res) => {
    try {
        const { name, content } = req.body;
        const userId = req.authenticatedUser._id;

        const document = new Document({
            name,
            content,
            owner: userId,
        });

        await document.save();

        res.status(201).json({ documentId: document._id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});

router.get('/', authenticate, async (req, res) => {
    try {
        const userId = req.authenticatedUser._id;

        const documents = await Document.find({ owner: userId }, 'name _id');

        res.status(200).json(documents);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});

router.delete('/:documentId', authenticate, async (req, res) => {
    try {
        const documentId = req.params.documentId;
        const authenticatedUserId = req.authenticatedUser._id;

        const document = await Document.findById(documentId);

        if (!document) {
            return res.status(404).json({ success: false, message: 'Document not found.' });
        }

        if (document.owner.toString() !== authenticatedUserId.toString()) {
            return res.status(403).json({ success: false, message: 'You are not authorized to delete this document.' });
        }

        await Document.deleteOne({ _id: documentId });

        return res.status(200).json({ success: true, message: 'The document was deleted successfully!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, error: 'An error occurred while processing your request.' });
    }
});

router.get('/:documentId/shared', authenticate, async (req, res) => {
    try {
        const documentId = req.params.documentId;
        const authenticatedUserId = req.authenticatedUser._id;
        const document = await Document.findById(documentId, { shared: 1, owner: 1, _id: 0 });

        if (document.owner.toString() !== authenticatedUserId.toString()) {
            return res.status(403).json({ success: false, message: 'You are not authorized to view the shared list.' });
        }

        const responseDocument = {
            shared: document.shared,
        };

        res.status(200).json(responseDocument);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});

router.post('/:documentId/shared', authenticate, async (req, res) => {
    try {
        const documentId = req.params.documentId;
        const authenticatedUserId = req.authenticatedUser._id;
        const sharingList = req.body.shared;

        for (const mobileNumber of sharingList) {
            const mobileNumberPattern = /^[0-9]{10}$/;

            if (!mobileNumberPattern.test(mobileNumber)) {
                return res.status(400).json({ success: false, error: 'Invalid mobile numbers in the list.' });
            }

            const existingUser = await User.findOne({ phone: mobileNumber });

            if (existingUser === null) {
                return res.status(400).json({ success: false, error: 'Invalid mobile numbers in the list.' });
            }
        }

        const document = await Document.findById(documentId);

        if (!document) {
            return res.status(404).json({ success: false, message: 'Document not found.' });
        }


        if (document.owner.toString() !== authenticatedUserId.toString()) {
            return res.status(403).json({ success: false, message: 'You are not authorized to share this document.' });
        }

        document.shared = sharingList;

        await document.save();

        return res.status(200).json({ success: true, message: 'Document access updated successfully.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, error: 'An error occurred while processing your request.' });
    }
});

module.exports = router;