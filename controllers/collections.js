const express = require('express');
const router = express.Router();
const { Collection } = require('../models');

// CREATE
const addCollection = async (req, res) => {
    try {
        const collection = await Collection.create(req.body);
        res.json(collection);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// READ ALL
const fetchCollection = async (req, res) => {
    try {
        const collections = await Collection.findAll();
        res.json(collections);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// READ ONE
const fetchCollectionById = async (req, res) => {
    try {
        const collection = await Collection.findByPk(req.params.id);
        if (!collection) return res.status(404).json({ error: 'Not found' });
        res.json(collection);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// UPDATE
const updateCollection = async(req, res) => {
    try {
        const collection = await Collection.findByPk(req.params.id);
        if (!collection) return res.status(404).json({ error: 'Not found' });
        await collection.update(req.body);
        res.json(collection);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE
const deleteCollection = async (req, res) => {
    try {
        const collection = await Collection.findByPk(req.params.id);
        if (!collection) return res.status(404).json({ error: 'Not found' });
        await collection.destroy();
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const       addBulkCollection = async (req, res) => {
    try {
        const collections = req.body;

        if (!Array.isArray(collections)) {
            return res.status(400).json({ error: 'Input must be an array' });
        }

        const result = await Collection.bulkCreate(collections, { validate: true });
        res.status(201).json({ message: 'Collections added successfully', data: result });
    } catch (error) {
        console.error('Error in bulk insert:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    addCollection,
    fetchCollection,
    updateCollection,
    fetchCollectionById,
    deleteCollection,
    addBulkCollection
};
