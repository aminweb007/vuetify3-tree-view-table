import { LocaleInstance } from 'vuetify';
import { GroupedData, ItemFormatted } from '@/lib/core/types'

export default <T>(data: T[], keys: string[], locale?: LocaleInstance): GroupedData<T>[] => {
    const groupedData = groupByKeys(data, keys);
    return flattenItems(groupedData);
}

/**
 * Returns the quarter of the year based on the given date.
 * @param {Date} date The date object from which to determine the quarter.
 * @returns {string} The quarter of the year as a string (e.g., "1st Quarter", "2nd Quarter", etc.).
 */
function getQuarterFromDate(date: Date): string {
    const month = date.getMonth() + 1;

    if (month >= 1 && month <= 3) {
        return "1st Quarter";
    } else if (month >= 4 && month <= 6) {
        return "2nd Quarter";
    } else if (month >= 7 && month <= 9) {
        return "3rd Quarter";
    } else {
        return "4th Quarter";
    }
};


/**
 * Flattens an array of grouped data items into a flat array of formatted items.
 * @param {GroupedData<T>[]} items The array of grouped data items to be flattened.
 * @returns {ItemFormatted[]} A flat array of formatted items.
 * @template T The type of the grouped data items.
 */
const flattenItems = <T>(items: GroupedData<T>[]) => {
    const formatted: ItemFormatted[] = [];

    // Define a recursive function to format each grouped data item
    const formatItem = <T>(item: GroupedData<T>, level: number) => {
        // Destructure the item and extract children
        let { children, ...tempFormat } = item;
        // Create a formatted item object with additional properties
        let formattedItem = { ...tempFormat, expanded: false, level: level } as ItemFormatted;
        formattedItem.hasChildren = item.children != null;
        // Push the formatted item to the array
        formatted.push(formattedItem);
        // Recursively process children if they exist
        if (item.children) {
            item.children.forEach((child) => formatItem(child as GroupedData<T>, level + 1));
        }
    };

    // Iterate through each grouped data item and format it
    items.forEach(item => formatItem(item, 0));

    // Return the array of formatted items
    return formatted;
};


/**
 * Groups an array of data items by specified keys and returns an array of grouped data.
 * @param {T[]} data The array of data items to be grouped.
 * @param {string[]} keys The keys to group the data items by.
 * @param {LocaleInstance} [locale] Optional locale instance for formatting.
 * @returns {GroupedData<T>[]} An array of grouped data items.
 * @template T The type of the data items.
 */
function groupByKeys<T>(data: T[], keys: string[], locale?: LocaleInstance): GroupedData<T>[] {

    /**
     * Recursively calculates the sum of prices for each group in the grouped data.
     * @param {GroupedData<T>[]} groupedData The array of grouped data items.
     * @template T The type of the data items.
     */
    const calculateSums = (groupedData: GroupedData<T>[]) => {
        for (const item of groupedData) {
            if (!item.children || item.children.length === 0) {
                item.price = item.price || 0;
            } else {
                if (item.children[0] && typeof item.children[0] === 'object' && 'key' in item.children[0]) {
                    calculateSums(item.children as GroupedData<T>[]);
                }
                item.price = (item.children).reduce((acc, child) => {
                    if (child && typeof child === 'object' && 'price' in child) {
                        return acc + (child as any).price;
                    }
                }, 0);
            }
        }
    };

    /**
     * Inserts a new item into a sorted array while maintaining the sorting order.
     * @param {any[]} array The sorted array to insert into.
     * @param {any} newItem The new item to insert into the array.
     * @param {Function} comparator A comparator function used to determine the sorting order.
     *                              It should return a negative number if the first argument is less than the second,
     *                              a positive number if the first argument is greater than the second, or 0 if they are equal.
     */
    function insertSorted(array: any, newItem: any, comparator: any) {
        let i = 0;
        while (i < array.length && comparator(array[i], newItem) < 0) {
            i++;
        }
        array.splice(i, 0, newItem);
    }

    /**
     * Compares two objects or arrays of objects based on their keys or names.
     * @param {GroupedData<T>[] | T[]} obj1 The first object or array of objects to compare.
     * @param {GroupedData<T>[] | T[]} obj2 The second object or array of objects to compare.
     * @returns {number} A number indicating the comparison result:
     *                   - If obj1 is less than obj2, returns a negative number.
     *                   - If obj1 is greater than obj2, returns a positive number.
     *                   - If obj1 is equal to obj2, returns 0.
     */
    const comparator = (obj1: GroupedData<T>[] | T[], obj2: GroupedData<T>[] | T[]): number => {
        const val1 = 'key' in obj1 ? obj1.key : 'name' in obj1 ? obj1.name : '';
        const val2 = 'key' in obj2 ? obj2.key : 'name' in obj2 ? obj2.name : '';
        if (typeof val1 === 'number' && typeof val2 === 'number') {
            return val1 - val2;
        } else if (typeof val1 === 'string' && typeof val2 === 'string') {
            return val1.localeCompare(val2);
        } else {
            return 0;
        }
    };

    const groupedData: GroupedData<T>[] = data.reduce((acc, item) => {
        let currentGroup: GroupedData<T>[] | T[] = acc;

        // Iterate through the keys to determine the grouping
        keys.forEach((key, index) => {
            let objKey = key;
            let value = (item as any)[objKey];
            let formattedVal = null;

            // Handle special cases for certain keys
            if (key === "year") {
                objKey = "date";
                value = (item as any)[objKey].getFullYear();
            } else if (key === "month") {
                objKey = "date";
                value = (item as any)[objKey].getMonth();
                formattedVal = (item as any)[objKey].toLocaleString(locale, { month: 'long' })
            } else if (key === "quarter") {
                objKey = "date";
                value = getQuarterFromDate((item as any)[objKey]);
            }
            // Check if the current group already contains a subgroup with the value
            if (!currentGroup.find(group => (group as GroupedData<T>).key === value)) {
                // Insert a new subgroup into the current group, sorted by key
                insertSorted((currentGroup as GroupedData<T>[]), { key: value, name: (formattedVal ? formattedVal : value), price: 0, children: [] }, comparator);
            }
            // Update the current group to the subgroup with the matching value
            currentGroup = (currentGroup.find(group => (group as GroupedData<T>).key === value) as GroupedData<T>)?.children || [];
        });
        // If the current group is an array, insert the item into it, sorted by key
        if (Array.isArray(currentGroup)) {
            insertSorted((currentGroup as T[]), item, comparator);
        }
        // Return the accumulated grouped data
        return acc;
    }, [] as GroupedData<T>[]);

    // Calculate sums for each group in the grouped data
    calculateSums(groupedData);

    // Return the final grouped data
    return groupedData;
}