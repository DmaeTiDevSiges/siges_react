
import { supabase } from './services/supabase';

async function checkColumns() {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .limit(1);

    if (error) {
        console.error(error);
    } else if (data && data.length > 0) {
        console.log(Object.keys(data[0]));
    } else {
        console.log('No data found in users table');
    }
}

checkColumns();
