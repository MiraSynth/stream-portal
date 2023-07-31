# GPU Partitioning with Hyper-V
Staying safe by virtualizing your gaming PC with GPU Partitioning. Do note that the usage of the following tutorial may cause damage to your windows installation a worst, so please make sure all your precious files are backup up safely before continuing. Happy safe gaming! 💜 

## Assumptions
This will assume you already know how to enable Hyper-V and install Windows, until we get to enable the GPU share;
- Use `Generation 2` when creating
- Disable `Settings > Checkpoints`
- In the VMs enable `Settings > Integration Services > Guest Services`

## Copying your Drivers
You will need to install the latest NVIDIA drivers for the following to work properly
- Go to `windows/System32` and copy all the NVIDIA driver files, they all start with `nv`.
- Paste them in a temp folder on your Desktop
- Go to `windows/System32/DriverStore/FileRepository` and copy the entire folder that contains the NVIDIA driver. There could be multiple, so just copy the last created. Ex. Starts with `nv_dispig.inf_...`
- Back in that temporary folder on your Desktop, create the following folder structure `HostDriverStore/FileRepository` and copy that `nv_dispig.inf_...` folder in it
- Zip the entire contents of that temp folder on your desktop, name it `Drivers.zip`

## Preparing your VM
This is when we are going to copy the files to you VM
- You will need to start Poweshell with administrator privileges
- Enter the command `Copy-VMFile "[VM-NAME]" -SourcePath "C:\Users\[USER]\Desktop\[TEMP-FOLDER]\Drivers.zip" -DestinationPath "C:\Drivers.zip" -CreateFullPath -FileSource Host`
- Replace all placeholder marked with square brackets to reflect your system `[...]`
- Once the copy is ready, Start the VM
- Go to `C:\Drivers.zip` and unzip the drivers
- Copy all the files in the `System32` directory, allow it to replace files as it copies
- Turn the VM Off
- In the VMs `Settings > Integration Services > Guest Services` disable it

## Enabling GPU Partitioning
This will share your hosts GPU with the VM
- Open ** PowerShell ISE ** with admin privileges
- Run the command `Set-ExecutionPolicy Unrestricted` to be able to run privileged commands
- Copy and paste the following in the main ISE editor windows, replace `[VM-NAME]` with your VMs name

```
$vm = "[VM-NAME]"

Add-VMGpuPartitionAdapter -VMName $vm
Set-VMGpuPartitionAdapter -VMName $vm -MinPartitionVRAM 80000000 -MaxPartitionVRAM 100000000 -OptimalPartitionVRAM 100000000 -MinPartitionEncode 80000000 -MaxPartitionEncode 100000000 -OptimalPartitionEncode 100000000 -MinPartitionDecode 80000000 -MaxPartitionDecode 100000000 -OptimalPartitionDecode 100000000 -MinPartitionCompute 80000000 -MaxPartitionCompute 100000000 -OptimalPartitionCompute 100000000

Set-VM -GuestControlledCacheTypes $true -VMName $vm
Set-VM -LowMemoryMappedIoSpace 1Gb -VMName $vm
Set-VM –HighMemoryMappedIoSpace 32GB –VMName $vm
```

- Run the script by clicking the play button at the top toolbar in ISE
- When done, run the command `Set-ExecutionPolicy Restricted` to disallow rogue scripts from executing
- Start your VM

## Verify your GPU and VM
- Login to Windows
- Open `Device Manager`
- Under `Display adaptors` make sure that your NVIDIA Graphics Card model is shown and enabled. 

## Set a custom resolution
- With the VM turned off
- Open Powershell
- Run the command `Set-VMVideo -VMName "[VM-NAME]" -resolutiontype single -HorizontalResolution 2560 -VerticalResolution 1440`, replace the H and Y resolutions to ones that suit your needs.

And your done! 🎉 Please let me know if you find any mistakes in the instructions!

***I will probably create a video tutorial for this too, only if i'm not feeling lazy 😅 ***