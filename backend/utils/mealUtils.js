const calculateMealsRemaining = (plan, meals) => {
    if (!plan) return 0;
    
    let eatenCount = 0;
      
    const start = new Date(plan.startDate);
    start.setHours(0,0,0,0);
    
    const end = new Date(); // today
    end.setHours(0,0,0,0);
    
    for(let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const isToday = d.getTime() === end.getTime();
        const isPast = d.getTime() < end.getTime();
        
        const record = meals.find(m => {
            const md = new Date(m.date);
            md.setHours(0,0,0,0);
            return md.getTime() === d.getTime();
        });
        
        const is2Time = plan.planType && plan.planType.includes("2");
        const is1Time = plan.planType && plan.planType.includes("1");
        const pref = plan.mealPreference; 
        
        let lEaten = false;
        let dEaten = false;
        
        if (record) {
            if (isPast) {
                lEaten = (record.lunch !== 'cancelled'); 
                dEaten = (record.dinner !== 'cancelled');
            } else if (isToday) {
                lEaten = (record.lunch === 'eaten'); 
                dEaten = (record.dinner === 'eaten');
            }
        } else {
            if (isPast) {
                lEaten = true;
                dEaten = true;
            }
        }
        
        if (is2Time) {
            if (lEaten) eatenCount++;
            if (dEaten) eatenCount++;
        } else if (is1Time) {
            if (pref === 'lunch' && lEaten) eatenCount++;
            if (pref === 'dinner' && dEaten) eatenCount++;
        }
    }
    
    return Math.max(0, plan.totalMeals - eatenCount);
};

module.exports = { calculateMealsRemaining };
