import { ChangeDetectionStrategy, Component, computed, signal, afterNextRender, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';

// --- Interfaces for all three data types (Updated per request) ---
interface CustomerItem {
  customer_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
  created_at: string;
}

interface AccountItem {
  account_id: number;
  customer_id: number;
  balance: number; // Updated field name (was current_balance)
  account_type: string;
  created_at: string;
}

interface TransactionItem {
  transaction_id: number;
  account_id: number;
  amount: number; // Updated field name (was transaction_amount)
  transaction_type: string; // e.g., 'DEPOSIT', 'WITHDRAWAL'. Replaced description.
  transaction_date: string; // Updated field name
}

// Type for the current active page
type CurrentPage = 'customers' | 'accounts' | 'transactions';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans">
      <div class="max-w-6xl mx-auto bg-white shadow-xl rounded-xl p-4 sm:p-8">
        
        <!-- Header and API Info -->
        <h1 class="text-3xl sm:text-4xl font-extrabold text-indigo-700 mb-2">Live API Dashboard</h1>
        <p class="text-sm text-gray-500 mb-6">API Base: {{ apiBaseUrl() }}</p>

        <!-- Navigation Tabs -->
        <div class="flex flex-wrap gap-2 mb-8 border-b border-gray-200">
		  @for (page of ['customers', 'accounts', 'transactions']; track page) {
            <button
              (click)="changePage(page)"
              [ngClass]="{
                'bg-indigo-600 text-white shadow-md': currentPage() === page,
                'bg-gray-100 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600': currentPage() !== page
              }"
              class="px-4 py-2 rounded-lg font-medium transition duration-150 ease-in-out uppercase text-sm"
            >
              {{ page }}
            </button>
          }
        </div>

        <!-- Content Area -->
        <div class="mt-6">
          <h2 class="text-2xl font-bold text-gray-800 mb-4 capitalize">{{ currentPage() }} Data</h2>

          <!-- Loading State -->
          @if (isLoading()) {
            <div class="flex flex-col items-center justify-center p-12 bg-indigo-50 rounded-lg shadow-inner">
              <svg class="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p class="mt-3 text-indigo-600 font-semibold">Loading {{ currentPage() }}...</p>
            </div>
          } @else {
            <!-- Error State -->
            @if (errorMessage()) {
              <div class="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg" role="alert">
                <p class="font-bold">Error Fetching Data</p>
                <p class="text-sm">{{ errorMessage() }}</p>
                <p class="text-xs mt-1">Please check the API URL and ensure CORS is configured on the backend.</p>
              </div>
            } @else {
              <!-- Empty State -->
              @if ( 
				(currentPage() === 'customers' && customerViewData().length === 0) ||
				(currentPage() === 'accounts' && accountViewData().length === 0) ||
				(currentPage() === 'transactions' && transactionViewData().length === 0)
				) {
                <div class="p-8 text-center bg-gray-50 border border-dashed border-gray-300 rounded-lg text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>No data loaded yet for {{ currentPage() }}.</p>
                </div>
              } @else {
                <!-- Data Table -->
                <div class="overflow-x-auto shadow-lg rounded-lg">
                  <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-indigo-50">
                      <tr>
                        @if (currentPage() === 'customers') {
                          <th class="px-6 py-3 text-left text-xs font-medium text-indigo-600 uppercase tracking-wider">Customer ID</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-indigo-600 uppercase tracking-wider">Name</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-indigo-600 uppercase tracking-wider">Email</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-indigo-600 uppercase tracking-wider">Phone</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-indigo-600 uppercase tracking-wider">Address</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-indigo-600 uppercase tracking-wider">Created At</th>
                        } @else if (currentPage() === 'accounts') {
                          <th class="px-6 py-3 text-left text-xs font-medium text-indigo-600 uppercase tracking-wider">Account ID</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-indigo-600 uppercase tracking-wider">Customer ID</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-indigo-600 uppercase tracking-wider">Type</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-indigo-600 uppercase tracking-wider">Created At</th>
                          <th class="px-6 py-3 text-right text-xs font-medium text-indigo-600 uppercase tracking-wider">Balance</th>
                        } @else if (currentPage() === 'transactions') {
                          <th class="px-6 py-3 text-left text-xs font-medium text-indigo-600 uppercase tracking-wider">Transaction ID</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-indigo-600 uppercase tracking-wider">Account ID</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-indigo-600 uppercase tracking-wider">Type</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-indigo-600 uppercase tracking-wider">Date</th>
                          <th class="px-6 py-3 text-right text-xs font-medium text-indigo-600 uppercase tracking-wider">Amount</th>
                        }
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                      @if (currentPage() === 'customers') {
                        @for (item of customerViewData(); track item.customer_id) {
                          <tr class="hover:bg-gray-50">
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ item.customer_id }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ item.first_name }} {{ item.last_name }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-indigo-600">{{ item.email }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ item.phone_number }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ item.address }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ item.created_at }}</td>
                          </tr>
                        }
                      } @else if (currentPage() === 'accounts') {
                        @for (item of accountViewData(); track item.account_id) {
                          <tr class="hover:bg-gray-50">
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ item.account_id }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ item.customer_id }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ item.account_type }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ item.created_at }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-right"
                                [ngClass]="item.balance > 0 ? 'text-green-600' : 'text-red-600'">
                              {{ item.balance | currency:'USD' }}
                            </td>
                          </tr>
                        }
                      } @else if (currentPage() === 'transactions') {
                        @for (item of transactionViewData(); track item.transaction_id) {
                          <tr class="hover:bg-gray-50">
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ item.transaction_id }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ item.account_id }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ item.transaction_type }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ item.transaction_date }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-right"
                                [ngClass]="item.amount > 0 ? 'text-green-600' : 'text-red-600'">
                              {{ item.amount | currency:'USD' }}
                            </td>
                          </tr>
                        }
                      }
                    </tbody>
                  </table>
                </div>
              }
            }
          }
        </div>
      </div>
    </div>
  `,
  styles: `
    /* Custom styles or overrides if needed */
    :host {
      display: block;
      min-height: 100vh;
    }
    table {
      table-layout: fixed;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App { 
  // API Base URL updated to be a signal as requested.
  apiBaseUrl = signal('https://banktest-u8wt.onrender.com/api');

  // --- State Signals ---
  currentPage = signal<CurrentPage>('customers');
  customerData = signal<CustomerItem[]>([]);
  accountData = signal<AccountItem[]>([]);
  transactionData = signal<TransactionItem[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

customerViewData = computed(() => this.currentPage() === 'customers' ? this.customerData() : []);
accountViewData = computed(() => this.currentPage() === 'accounts' ? this.accountData() : []);
transactionViewData = computed(() => this.currentPage() === 'transactions' ? this.transactionData() : []);


  
  // --- Dependency Injection and Hydration Fix ---
  constructor() {
    afterNextRender(() => {
      this.fetchData(this.currentPage()); 
    });
  }

  // --- Methods ---

 changePage(page: string): void {
  const typedPage = page as CurrentPage;

  if (this.currentPage() !== typedPage) {
    this.currentPage.set(typedPage);

    // Only fetch if data for the new page is currently empty
    switch (typedPage) {
      case 'customers':
        if (this.customerData().length === 0) this.fetchData(typedPage);
        break;
      case 'accounts':
        if (this.accountData().length === 0) this.fetchData(typedPage);
        break;
      case 'transactions':
        if (this.transactionData().length === 0) this.fetchData(typedPage);
        break;
    }
  }
}


  private async fetchData(resource: CurrentPage): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    // Use the signal for the URL
    const url = `${this.apiBaseUrl()}/${resource}`;

    try {
      const MAX_RETRIES = 3;
      let response: Response | null = null;

      // Implements exponential backoff for robust API calls
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          response = await fetch(url);
          if (response.ok) {
            break; // Success!
          }
        } catch (error) {
          console.error(`Fetch attempt ${attempt + 1} failed:`, error);
        }
        
        if (attempt < MAX_RETRIES - 1) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      if (!response || !response.ok) {
        throw new Error(`Failed to fetch data from ${url}. Status: ${response ? response.status : 'Network Error'}`);
      }

      const data = await response.json();
      
      // Update the correct signal based on the resource
      switch (resource) {
        case 'customers': this.customerData.set(data as CustomerItem[]); break;
        case 'accounts': this.accountData.set(data as AccountItem[]); break;
        case 'transactions': this.transactionData.set(data as TransactionItem[]); break;
      }
      
    } catch (error) {
      console.error('API Fetch Error:', error);
      this.errorMessage.set(`Could not connect to or retrieve data from API. Details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.isLoading.set(false);
    }
  }
}
