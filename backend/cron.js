const cron = require('node-cron');
const Meal = require('./models/Meal');
const Plan = require('./models/Plan');

const initCronJobs = () => {
    // Run every day at midnight (Server time)
    cron.schedule('0 0 * * *', async () => {
        try {
            console.log('Running daily meal auto-marking cron job...');
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            // Fetch all plans that are active
            const plans = await Plan.find({
                startDate: { $lte: yesterday },
                mealsRemaining: { $gt: 0 }
            });

            for (const plan of plans) {
                if (plan.expiryDate && new Date(plan.expiryDate).setHours(0,0,0,0) < yesterday.getTime()) {
                    continue; 
                }

                let deduction = 0;
                const is1Meal = plan.planType.startsWith("1_");
                const is2Meal = plan.planType.startsWith("2_");
                const pref = plan.mealPreference; 

                const mealRec = await Meal.findOne({ userId: plan.userId, date: yesterday });

                if (is2Meal) {
                    if (!mealRec || mealRec.lunch !== 'cancelled') deduction++;
                    if (!mealRec || mealRec.dinner !== 'cancelled') deduction++;
                } else if (is1Meal) {
                    if (pref === 'lunch' && (!mealRec || mealRec.lunch !== 'cancelled')) deduction++;
                    if (pref === 'dinner' && (!mealRec || mealRec.dinner !== 'cancelled')) deduction++;
                }

                if (deduction > 0) {
                    plan.mealsRemaining = Math.max(0, plan.mealsRemaining - deduction);
                    await plan.save();
                }
            }

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
