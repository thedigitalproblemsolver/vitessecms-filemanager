<?php declare(strict_types=1);

namespace VitesseCms\Filemanager\Controllers;

use VitesseCms\Core\AbstractController;
use VitesseCms\Core\AbstractControllerFrontend;
use VitesseCms\Core\Utils\DirectoryUtil;
use VitesseCms\Core\Utils\FileUtil;
use VitesseCms\Media\Enums\AssetsEnum;
use VitesseCms\Media\Services\AssetsService;

class IndexController extends AbstractControllerFrontend
{
    private AssetsService $assetsService;

    public function OnConstruct()
    {
        parent::onConstruct();

        $this->assetsService = $this->eventsManager->fire(AssetsEnum::ATTACH_SERVICE_LISTENER, new \stdClass());
    }

    public function indexAction(): void
    {
        $this->assetsService->loadFileManager();
        $this->assetsService->loadLazyLoading();

        $target = '';
        if ($this->request->get('target')) :
            $target = str_replace('btn_', '', $this->request->get('target'));
        endif;

        $this->viewService->set('content', $this->viewService->renderTemplate(
            'adminFilemanager',
            $this->configService->getVendorNameDir() . 'filemanager/src/Resources/views/',
            ['target' => $target]
        ));
    }

    public function scanAction(): void
    {
        if ($this->request->isAjax()) :
            $this->jsonResponse([
                'name' => '',
                'type' => 'folder',
                'path' => '',
                'items' => $this->scan($this->configService->getUploadDir())
            ]);
        endif;
    }

    protected function scan(string $dir): array
    {
        $children = DirectoryUtil::getMixedList($dir);
        $files = [];

        foreach ($children as $filename => $fullPath) :
            if (is_dir($fullPath)) :
                $files[] = [
                    'name' => $filename,
                    'type' => 'folder',
                    'path' => str_replace(
                        $this->configService->getWebDir() . 'uploads/' . $this->configService->getAccount(),
                        '',
                        $fullPath
                    ),
                    'items' => $this->scan($fullPath),
                    'hash' => md5($fullPath),
                ];
            else :
                $files[] = [
                    'name' => $filename,
                    'type' => 'file',
                    'path' => str_replace(
                        $this->configService->getWebDir() . 'uploads/' . $this->configService->getAccount() . '/',
                        '',
                        $fullPath
                    ),
                    'thumbpath' => str_replace(
                        $this->configService->getWebDir() . 'uploads/',
                        '',
                        $fullPath
                    ),
                    'size' => FileUtil::getSize($fullPath),
                    'hash' => md5($fullPath),
                ];
            endif;
        endforeach;

        return $files;
    }

    public function uploadAction(): void
    {
        $returnPath = '';
        if ($this->request->isAjax() && $this->request->hasFiles()) :
            foreach ($this->request->getUploadedFiles() as $file) :
                $name = FileUtil::sanatize($file->getName());
                $parent = $this->request->getPost('directory');
                if (!empty($parent)) :
                    $parent .= '/';
                endif;
                if ($file->moveTo($this->configService->getUploadDir() . $parent . $name)) :
                    $this->flashService->setSucces('ADMIN_FILE_UPLOAD_SUCCESS', [$file->getName()]);
                else :
                    $this->flashService->setError('ADMIN_FILE_UPLOAD_FAILED', [$file->getName()]);
                endif;
            endforeach;
        endif;

        $this->redirect('/filemanager/index' . $returnPath);
    }
}
