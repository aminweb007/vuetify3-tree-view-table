
// Define the structure of the accumulator object, to be adjusted based on your context
export interface GroupedData<T> {
    key: string,
    name: string,
    price: number,
    children: GroupedData<T>[] | T[];
}

// Define the structure of the select options to change the aggregation structure of the table
export interface Aggregate {
    title: string,
    value: { aggregate: string[] },
}

//Data formatted adding meta data to handle grouping
export interface ItemFormatted<T> extends GroupedData<T> {
    expanded: boolean,
    level: number,
    hasChildren: boolean,
}


