const { Location } = require('../models/index');

// Fetch all locations
exports.fetchLocations = async (req, res) => {
    try {
        const locations = await Location.findAll({
            where: { isDeleted: false }
        });
        return res.status(200).json({ message: 'Locations fetched', locations });
    } catch (err) {
        console.error('Fetch Locations Error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Fetch single location
exports.fetchSingleLocation = async (req, res) => {
    try {
        const location = await Location.findByPk(req.params.id, {
            attributes: [
                'id', 'locationName', 'address', 'website',
                'email', 'phone', 'country', 'timezone'
            ]
        });
        if (!location) {
            return res.status(404).json({ message: 'Location not found' });
        }
        res.status(200).json(location);
    } catch (err) {
        console.error('Fetch Single Location Error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Add location
exports.addLocation = async (req, res) => {
    try {
        const { locationName, address, website, email, phone, country, timezone } = req.body;

        const newLocation = await Location.create({
            locationName,
            address,
            website,
            email,
            phone,
            country,
            timezone
        });
        return res.status(201).json({
            success: true,
            status: 200,
            message: 'Location added successfully',
            location: newLocation
        });
    } catch (err) {
        console.error('Add Location Error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Update location
exports.updateLocation = async (req, res) => {
    try {
        const location = await Location.findByPk(req.params.id);
        if (!location) return res.status(404).json({ message: 'Location not found' });

        await location.update(req.body);
        res.status(200).json({
            message: 'Location updated successfully',
            location,
            status: 200
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Delete location
exports.deleteLocation = async (req, res) => {
    try {
        const { id } = req.params;

        const location = await Location.findByPk(id);
        if (!location) {
            return res.status(404).json({ message: 'Location not found' });
        }

        location.isDeleted = true;
        await location.save();
        res.status(200).json({ message: 'Location deleted successfully' });
    } catch (err) {
        console.error('Delete Location Error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
