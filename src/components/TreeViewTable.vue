<template>
  <v-container class="fill-height">
    <v-responsive class="align-center fill-height mx-auto" max-width="900">
      <v-row>
        <v-col>
          <v-card>
            <v-card-text>
              <v-data-table-virtual :headers="headers" :items="formattedItems" item-key="name" density="compact">
                <template v-slot:top>
                  <v-toolbar flat>
                    <v-col cols="5">
                      <v-toolbar-title>Tree View Table</v-toolbar-title>
                    </v-col>
                    <v-col cols="7">
                      <v-select v-if="aggregations && aggregations.length > 0" v-model="selectedAggregate"
                        label="Aggregates" :items="aggregations" clearable density="compact"
                        @update:modelValue="updateAggregation"></v-select>
                    </v-col>
                  </v-toolbar>
                </template>
                <template v-slot:item="{ item, index }">
                  <tr :class="{ 'alternate-row': index % 2 === 1, 'clickable': !item.hasChildren }">
                    <td v-for="header in headers" :key="header.key">
                      <template v-if="header.key === 'name'">
                        <span :style="{ paddingLeft: item.level * 40 + 'px' }">
                          <v-icon v-if="item.hasChildren" @click="toggleNode(item)">{{ item.expanded ? 'mdi-chevron-up'
                            : 'mdi-chevron-down' }}</v-icon>
                          {{ item.name }}
                        </span>
                      </template>
                      <template v-else-if="header.key === 'date'">{{ formatDate((item as any).date)
                        }}</template>
                      <template v-else-if="header.key === 'price'">${{ (item as
                        any).price.toFixed(2)
                        }}</template>
                      <template v-else>{{ item[header.key as keyof ItemFormatted] }}</template>
                    </td>
                  </tr>
                </template>
                <template v-slot:body.append>
                  <tr class="table_footer">
                    <td v-for="header in headers" :key="header.key">
                      <template v-if="header.key === 'price'">
                        <span>
                          ${{ formattedItems.filter(item => item.level ===
                            0).reduce((total, item) => total + item.price, 0).toFixed(2) }}
                        </span>
                      </template>
                    </td>
                  </tr>
                </template>
              </v-data-table-virtual>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-responsive>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, defineProps } from 'vue';
import { useLocale } from 'vuetify';
import { Aggregate, ItemFormatted } from '@/lib/core/types';
import aggregate from '@/composables/core/aggregate';

const { current } = useLocale();

/**
 * Props for the component.
 */
const props = defineProps({
  aggregations: {
    type: Array as () => Aggregate[],
    required: false,
    default: () => []
  },
  data: {
    type: Array,
    required: true,
    default: () => []
  },
  headers: {
    type: Array,
    required: true,
    default: () => []
  },
});

/**
 * Formats a date object into a string representation.
 * @param {Date} date The date object to be formatted.
 * @returns {string} A string representing the formatted date.
 */
const formatDate = (date: Date): string => {
  if (date) {
    const formattedDate = date.toLocaleDateString(current.value, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    return formattedDate;
  }
  return '';
};


const selectedAggregate = ref<Aggregate>();

function updateAggregation() {
  aggregatedItems.value = aggregate(props.data, selectedAggregate.value?.aggregate ?? [], current);
}

const aggregatedItems = ref<ItemFormatted[]>([]);

/**
 * Computed property to format items.
 */
const formattedItems = computed(() => {
  //Array holding items that will be displayed
  const formatted: ItemFormatted[] = [];

  const length = aggregatedItems.value.length;
  for (let i = 0; i < length;) {
    //this item is displayed
    formatted.push(aggregatedItems.value[i]);
    //check if the current item is expanded
    if (!aggregatedItems.value[i].expanded) {
      const level = aggregatedItems.value[i].level;
      i++;
      //if not expanded all items having higher level value are ignored
      while (i < length && aggregatedItems.value[i].level > level) {
        i++;
      }
      //if the item is expanded we advance the cursor and let the iteration pick the item into display array
    } else {
      i++;
    }
  }
  return formatted;
});

const toggleNode = (item: ItemFormatted) => {
  item.expanded = !item.expanded;
};

updateAggregation();

</script>
<style scoped>
.alternate-row {
  background-color: rgb(var(--v-theme-surface-light));
}

.clickable:hover {
  background-color: rgb(var(--v-theme-success));
}

.clickable {
  cursor: pointer;
}

.table_footer {
  background-color: rgb(var(--v-theme-secondary-darken-1));
}
</style>