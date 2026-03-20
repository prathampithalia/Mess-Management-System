const cron = require('node-cron');
const Meal = require('./models/Meal');

const initCronJobs = () => {
    // Run every day at midnight (Server time)
    cron.schedule('0 0 * * *', async () => {
        try {
            console.log('Running daily meal auto-marking cron job...');
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Update all past pending lunches/dinners to eaten in the Meal records
            // so Admin UI shows them correctly
            const lunchRes = await Meal.updateMany(
                { date: { $lt: today }, lunch: 'pending' },
                { $set: { lunch: 'eaten' } }
            );

            const dinnerRes = await Meal.updateMany(
                { date: { $lt: today }, dinner: 'pending' },
                { $set: { dinner: 'eaten' } }
            );

            console.log(`Auto-marked past meals. Lunch mod: ${lunchRes.modifiedCount}, Dinner mod: ${dinnerRes.modifiedCount}`);
        } catch (error) {
            console.error('Error in cron job:', error);
        }
    });
};

module.exports = initCronJobs;
