<?php declare(strict_types=1);

namespace VitesseCms\Filemanager\Forms;

use VitesseCms\Form\AbstractForm;
use VitesseCms\Form\Models\Attributes;

class AddDirectoryForm extends AbstractForm
{
    public function build($parent): AbstractForm
    {
        $this->addText('Directory', 'directoryname', (new Attributes())->setRequired())
            ->addHidden('parent', $parent)
            ->addSubmitButton('%CORE_SAVE%');

        return $this;
    }
}
