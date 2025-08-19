const { Tax } = require('../models/index');

exports.getTaxes = async (req, res) => {
    try {
        const taxes = await Tax.findAll();
        res.status(200).json(taxes);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.addTax = async (req, res) => {
    try {
        const { label, value } = req.body;
        const newTax = await Tax.create({ label, value, isDefault: false });
        res.status(201).json(newTax);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteTax = async (req, res) => {
    try {
        const { id } = req.params;
        const tax = await Tax.findByPk(id);
        if (!tax) return res.status(404).json({ message: 'Tax not found' });
        await tax.destroy();
        res.status(200).json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.setDefaultTax = async (req, res) => {
    try {
        const { id } = req.params;

        // unset all taxes default
        await Tax.update({ isDefault: false }, { where: {} });
        // set selected tax default
        await Tax.update({ isDefault: true }, { where: { id } });

        // return updated list
        const taxes = await Tax.findAll();
        res.status(200).json(taxes);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};
