import { Component, signal, ChangeDetectionStrategy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

// --- Interfaces for all three data types ---
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
  balance: number;
  account_type: string;
  created_at: string;
}

interface TransactionItem {
  transaction_id: number;
  account_id: number;
  amount: number;
  transaction_type: string; // e.g., 'DEPOSIT', 'WITHDRAWAL'
  transaction_date: string;
}

type CurrentPage = 'customers' | 'accounts' | 'transactions';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  template: `
    <script src="https://cdn.tailwindcss.com"></script>
    <div class="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans">
      <div class="max-w-6xl mx-auto">
        
        <header class="py-6 mb-4 bg-white shadow-lg rounded-xl">
          <h1 class="4xl text-center font-extrabold text-indigo-700">Banking Data Dashboard</h1>
          <p class="text-gray-600 text-center mt-2">API Base: 
            <code class="bg-indigo-100 px-2 py-1 rounded text-sm text-indigo-600">{{ apiBaseUrl() }}</code>
          </p>
        </header>

        <!-- Navigation Menu -->
        <nav class="flex justify-center mb-8 space-x-2 sm:space-x-4">
          @for (page of ['customers', 'accounts', 'transactions']; track page) {
            <button
              (click)="changePage(page)"
              [ngClass]="{
                'bg-indigo-600 text-white shadow-md': currentPage() === page,
                'bg-white text-gray-700 hover:bg-indigo-50 border border-gray-300': currentPage() !== page
              }"
              class="capitalize px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-semibold transition duration-200 text-sm sm:text-base"
            >
              {{ page }}
            </button>
          }
        </nav>

        <main>
          <h2 class="text-2xl font-bold text-gray-800 capitalize mb-6">{{ currentPage() }} Data</h2>

          <!-- Fetch Data Button -->
          <div class="text-center mb-8">
            <button
              (click)="fetchData()"
              [disabled]="loading()"
              class="px-8 py-3 text-lg font-semibold rounded-full shadow-lg transition duration-300 ease-in-out"
              [ngClass]="{
                'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95': !loading(),
                'bg-indigo-300 text-gray-500 cursor-not-allowed': loading()
              }"
            >
              @if (loading()) {
                <span class="flex items-center justify-center">
                  <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading {{ currentPage() }}...
                </span>
              } @else {
                Fetch {{ currentPage() }} Data
              }
            </button>
          </div>

          <!-- Status Message/Error -->
          @if (error()) {
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
              <strong class="font-bold">API Error!</strong>
              <span class="block sm:inline ml-2">{{ error() }}</span>
            </div>
          } @else if (getCurrentData().length > 0) {
            <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6">
              <strong class="font-bold">Success!</strong>
              <span class="block sm:inline ml-2">Successfully fetched {{ getCurrentData().length }} {{ currentPage() }} item(s).</span>
            </div>
          } @else if (!loading()) {
            <div class="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative mb-6">
              <strong class="font-bold">Ready!</strong>
              <span class="block sm:inline ml-2">Click the button to load {{ currentPage() }} data.</span>
            </div>
          }

          <!-- Data Display Area (Conditional Rendering based on currentPage) -->
          <div class="bg-white shadow-xl rounded-xl overflow-hidden">
            @if (getCurrentData().length === 0) {
              <p class="p-6 text-center text-gray-500">No data loaded yet for {{ currentPage() }}.</p>
            } @else {
              <div class="overflow-x-auto">
                <!-- Display Tables based on page -->
                @switch (currentPage()) {
                  @case ('customers') {
                    <table class="min-w-full divide-y divide-gray-200">
                      <thead class="bg-indigo-50">
                        <tr>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Name</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Name</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date</th>
                        </tr>
                      </thead>
                      <tbody class="bg-white divide-y divide-gray-200">
                        @for (item of customersData(); track item.customer_id) {
                          <tr class="hover:bg-gray-50 transition duration-150">
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">{{ item.customer_id }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ item.first_name }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ item.last_name }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ item.email }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ item.phone_number }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ item.address }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ item.created_at | date:'mediumDate' }}</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  }
                  @case ('accounts') {
                    <table class="min-w-full divide-y divide-gray-200">
                      <thead class="bg-indigo-50">
                        <tr>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account ID</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer ID</th>
                          <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opened Date</th>
                        </tr>
                      </thead>
                      <tbody class="bg-white divide-y divide-gray-200">
                        @for (item of accountsData(); track item.account_id) {
                          <tr class="hover:bg-gray-50 transition duration-150">
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">{{ item.account_id }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ item.customer_id }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-700 text-right">{{ item.balance | currency:'USD' }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ item.account_type }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ item.created_at | date:'mediumDate' }}</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  }
                  @case ('transactions') {
                    <table class="min-w-full divide-y divide-gray-200">
                      <thead class="bg-indigo-50">
                        <tr>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account ID</th>
                          <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        </tr>
                      </thead>
                      <tbody class="bg-white divide-y divide-gray-200">
                        @for (item of transactionsData(); track item.transaction_id) {
                          <tr class="hover:bg-gray-50 transition duration-150">
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">{{ item.transaction_id }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ item.account_id }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-right"
                                [ngClass]="{'text-red-600': item.transaction_type === 'WITHDRAWAL', 'text-green-600': item.transaction_type === 'DEPOSIT'}">
                              {{ item.amount | currency:'USD' }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ item.transaction_type }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ item.transaction_date | date:'medium' }}</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  }
                }
              </div>
            }
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [
    `
    /* Custom styles for better aesthetics */
    :host {
      display: block;
      /* Ensures the component takes full height */
      min-height: 100vh;
    }
    .font-sans {
      font-family: 'Inter', sans-serif;
    }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  // --- Signals for State Management ---
  // The base URL of the API you deployed on Render. (Modified to be the BASE)
  apiBaseUrl = signal('https://banktest-u8wt.onrender.com/api'); 
  
  // State for the current view
  currentPage = signal<CurrentPage>('customers');

  // State for the fetched data for all pages
  customersData = signal<CustomerItem[]>([]);
  accountsData = signal<AccountItem[]>([]);
  transactionsData = signal<TransactionItem[]>([]);

  // State for loading status
  loading = signal(false);

  // State for error messages
  error = signal<string | null>(null);

  // Configuration map for pages, endpoints, and associated signals
  private pageConfigs = {
    'customers': { 
      endpoint: '/customers', 
      dataSignal: this.customersData as any, 
      dataType: 'Customer' 
    },
    'accounts': { 
      endpoint: '/accounts', 
      dataSignal: this.accountsData as any, 
      dataType: 'Account' 
    },
    'transactions': { 
      endpoint: '/transactions', 
      dataSignal: this.transactionsData as any, 
      dataType: 'Transaction' 
    }
  };

  /**
   * Switches the current view page.
   * @param page The key of the page to switch to ('customers', 'accounts', or 'transactions').
   */
  changePage(page: string) {
    // We cast it here in the TypeScript context where it's safe
    this.currentPage.set(page as CurrentPage);
    
    // When the page changes, try to fetch data if the current signal is empty
    if (this.getCurrentData().length === 0) {
      this.fetchData();
    }
  }

  /**
   * Helper function to get the current page's data signal value.
   */
  getCurrentData(): (CustomerItem | AccountItem | TransactionItem)[] {
    return this.pageConfigs[this.currentPage()].dataSignal();
  }

  /**
   * Fetches data from the live API endpoint for the current page.
   */
  async fetchData() {
    const config = this.pageConfigs[this.currentPage()];
    const fullUrl = this.apiBaseUrl() + config.endpoint;

    this.loading.set(true);
    this.error.set(null);

    try {
      // Exponential backoff retry logic
      const maxRetries = 3;
      let response: Response | undefined;
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          response = await fetch(fullUrl);
          if (response.ok) break; // Success, break out of loop
        } catch (e) {
          if (attempt === maxRetries - 1) throw e; // Last attempt failed, throw network error
          await new Promise(resolve => setTimeout(resolve, 2 ** attempt * 1000)); // Wait 1s, 2s, 4s
        }
      }

      if (!response || !response.ok) {
        throw new Error(`HTTP error! Status: ${response?.status || 'N/A'} - ${response?.statusText || 'Failed to fetch'}`);
      }

      // Check if the response content is JSON before parsing
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
         throw new Error("Received non-JSON response from API.");
      }
      
      const result: (CustomerItem | AccountItem | TransactionItem)[] = await response.json();
      
      // Update the correct data signal
      config.dataSignal.set(result);

    } catch (err) {
      console.error('Fetch error:', err);
      this.error.set(err instanceof Error ? err.message : 'An unknown error occurred during fetch.');
    } finally {
      this.loading.set(false);
    }
  }

  // Effect to log data changes (optional, for debugging)
  logData = effect(() => {
    console.log(`Current ${this.currentPage()} Data State:`, this.getCurrentData());
  });

  // Automatically fetch initial data when the component initializes
  constructor() {
    this.fetchData();
  }
}
