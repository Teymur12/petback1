import Register from '../model/register.model.js';
import Listing from '../model/listing.model.js';

// Toggle favorite listing (bəyən/bəyənmə)
export const toggleFavoriteListing = async (req, res) => {
    try {
        const { listingId } = req.params;
        const userId = req.user.id;

        // Check if listing exists
        const listing = await Listing.findById(listingId);
        if (!listing) {
            return res.status(404).json({
                success: false,
                message: 'Elan tapılmadı'
            });
        }

        // Get user
        const user = await Register.findById(userId);

        // Check if already favorited
        const isFavorited = user.favoriteListings.includes(listingId);

        if (isFavorited) {
            // Remove from favorites
            user.favoriteListings = user.favoriteListings.filter(
                id => id.toString() !== listingId
            );
            await user.save();

            return res.status(200).json({
                success: true,
                message: 'Elan bəyənilənlərdən çıxarıldı',
                isFavorited: false
            });
        } else {
            // Add to favorites
            user.favoriteListings.push(listingId);
            await user.save();

            return res.status(200).json({
                success: true,
                message: 'Elan bəyənilənlərə əlavə edildi',
                isFavorited: true
            });
        }

    } catch (error) {
        console.error('Toggle favorite error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server xətası',
            error: error.message
        });
    }
};

// Get user's favorite listings
export const getFavoriteListings = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await Register.findById(userId)
            .populate({
                path: 'favoriteListings',
                populate: {
                    path: 'seher',
                    select: 'cityName'
                }
            });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'İstifadəçi tapılmadı'
            });
        }

        return res.status(200).json({
            success: true,
            data: user.favoriteListings || [],
            count: user.favoriteListings?.length || 0
        });

    } catch (error) {
        console.error('Get favorites error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server xətası',
            error: error.message
        });
    }
};

// Check if listing is favorited
export const checkIfFavorited = async (req, res) => {
    try {
        const { listingId } = req.params;
        const userId = req.user.id;

        const user = await Register.findById(userId);
        const isFavorited = user.favoriteListings.includes(listingId);

        return res.status(200).json({
            success: true,
            isFavorited
        });

    } catch (error) {
        console.error('Check favorite error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server xətası',
            error: error.message
        });
    }
};
