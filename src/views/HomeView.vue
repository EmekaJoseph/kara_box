<template>
  <div class="min-vh-100 base-page " style="background-color:#3A2049;">
    <div class="container">

      <div class="row min-vh-100 justify-content-center align-items-center">
        <div class="col-lg-7">
          <div class="text-center fw-bolder text-white" style="font-size: 2.3rem;">
            KARAOKE BOX
          </div>
          <div class="card border-0 shadow-sm" style="min-height: 450px;">
            <div class="card-body">

              <ul class="nav nav-tabs" id="myTab" role="tablist">
                <li class="nav-item" role="presentation">
                  <button class="nav-link active" id="vault-tab" data-bs-toggle="tab" data-bs-target="#vault"
                    type="button" role="tab" aria-controls="vault" aria-selected="true">
                    <i class="bi bi-box-seam-fill"></i> Vault
                  </button>
                </li>
                <li class="nav-item" role="presentation">
                  <button class="nav-link" id="search-tab" data-bs-toggle="tab" data-bs-target="#search" type="button"
                    role="tab" aria-controls="search" aria-selected="false">
                    <i class="bi bi-search"></i> List
                  </button>
                </li>
              </ul>

              <!-- Tab panes -->
              <div class="tab-content p-3">
                <div class="tab-pane active" id="vault" role="tabpanel" aria-labelledby="vault-tab">
                  <VaultComponent />
                </div>
                <div class="tab-pane" id="search" role="tabpanel" aria-labelledby="search-tab">
                  <SearchComponent />
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
  <playModal />
</template>


<script setup lang="ts">
import playModal from '@/components/playModal.vue';
import VaultComponent from '@/components/vaultComponent.vue';
import SearchComponent from '@/components/searchComponent.vue';

</script>

<style scoped>
/* .video-player {
  width: 100%;

} */

.nav-link {
  color: var(--bs-text-muted);
  border: none;
}

.nav-link.active {
  border-bottom: 2px #204935 solid !important;
}

.tab-pane {
  min-height: 250px;
}


.base-page {
  background: url('/kara1.jpg');
  background-size: cover;
  background-position: center center;
}


.base-page::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.895);
  /* Tint color with opacity */
  z-index: 1;
  /* Keeps the tint above the background */
}

.base-page>* {
  position: relative;
  z-index: 2;
  /* Ensures content stays above the tint */
}
</style>
