serve:
	npm run serve

build:
	npm run sass

watch:
	npm run sass &
	npm run serve

sync-template:
	npm run template-sync

sync-gallery:
	npm run gallery-gen

sync-articles:
	npm run article-gen

sync: sync-template sync-gallery sync-template