<template>
  <v-app>
    <v-main>
      <TreeViewTable :aggregations="aggregations" :data="items" :headers="headers" />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import jsonData from '@/assets/data.json';

//Aggregates used to group data
const aggregations = [
  { title: "Category > Year > Quarter > Month", value: { aggregate: ["category", "year", "quarter", "month"] } },
  { title: "Year > Quarter > Month > Category", value: { aggregate: ["year", "quarter", "month", "category"] } }
];

// Header of the table
const headers = [
  { title: 'Name', key: 'name', sortable: false },
  { title: 'Description', key: 'description', sortable: false },
  { title: 'Date', key: 'date', sortable: false },
  { title: 'Price', key: 'price', sortable: false },
];

//Data interface definition
interface DataItem {
  description: string;
  price: number;
  category: string;
  date: Date;
  name: string;
}

//Data loaded from sample file
const items: DataItem[] = jsonData.map(item => ({
  description: item.description,
  price: item.price,
  category: item.category,
  date: new Date(item.date),
  name: item.name
}));
</script>
